/**
 * Copyright 2018-2022 bluefox <dogafox@gmail.com>
 *
 * Licensed under the Creative Commons Attribution-NonCommercial License, Version 4.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://creativecommons.org/licenses/by-nc/4.0/legalcode.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
import React, {Component, createRef} from 'react';
import PropTypes from 'prop-types';

import ReactEchartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { SVGRenderer } from 'echarts/renderers';

import Snackbar from '@mui/material/Snackbar';
import Fab from '@mui/material/Fab';
import { Dialog } from "@mui/material";
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { Utils, I18n } from '@iobroker/adapter-react-v5';

import { MdClose as CloseIcon } from 'react-icons/md';

import CustomButton from '../States/components/CustomButton';

import Theme from '../theme';
import CustomFab from '../States/components/CustomFab';
import cls from './style.module.scss';

echarts.use([/*GridComponent,*/ LineChart, SVGRenderer]);

class SmartDialogGeneric extends Component {

    static COLOR_MODES = {
        RGB: 0,
        HUE: 1,
        R_G_B: 2,
        TEMPERATURE: 3
    };

    // expected:
    static propTypes = {
        name: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object
        ]),
        dialogKey: PropTypes.string,
        windowWidth: PropTypes.string,

        onClose: PropTypes.func,
        onCollectIds: PropTypes.func
    };

    constructor(props) {
        super(props);

        this.stateRx = {
            toast: ''
        };

        // disable context menu after long click
        // window.addEventListener('contextmenu', SmartDialogGeneric.onContextMenu, false);
        //this.refModal = React.createRef();
        this.dialogStyle = {};
        this.closeOnPaperClick = false;
        this.savedParent = null;

        this.subscribes = null;
        this.subscribed = false;
        this.editMode = this.props.editMode;
        this.positionTuned = false;
        this.echartsReact = createRef();
        this.firstGetCharts = {};
        this.expireInSecInterval = {};
    }

    componentReady() {
        //    ↓ ignore error here
        // eslint-disable-next-line react/no-direct-mutation-state
        this.state = this.stateRx;
        delete this.stateRx;
    }

    static onContextMenu(e) {
        if (!e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
            console.log('Ignore context menu' + e);
            return false;
        }
    }

    componentDidMount() {
        // document.getElementById('root').className = `blurDialogOpen`;
        // move this element to the top of body
        /*if (this.refModal) {
            this.savedParent = this.refModal.current.parentElement;
            document.body.appendChild(this.refModal.current);
        }*/

        if (this.subscribes && !this.subscribed) {
            this.subscribed = true;
            this.props.onCollectIds(this, this.subscribes, true);
        }

        /*if (!this.positionTuned) {
            Object.assign(this.dialogStyle, {left: 'calc(50% - ' + (this.refModal.current.firstChild.offsetWidth / 2) + 'px)'});
            this.forceUpdate();
        }*/
    }

    componentWillUnmount() {
        // document.getElementById('root').className = ``;
        //this.refModal && this.savedParent.appendChild(this.refModal.current);

        if (this.props.onCollectIds && this.subscribed) {
            this.props.onCollectIds(this, this.subscribes, false);
            this.subscribed = null;
        }
    }

    // default handler
    updateState(id, state) {
        const newState = {};
        if (state) {
            newState[id] = {val: state.val, ts: state.ts, lc: state.lc};
        } else {
            newState[id] = null;
        }
        this.setState(newState);
    }

    mayClose() {
        return !(this.click && Date.now() - this.click < 50);
    }

    onClose(forceClose) {
        if (forceClose || this.mayClose()) {
            // window.removeEventListener('contextmenu', SmartDialogGeneric.onContextMenu, false);
            this.props.onClose && this.props.onClose();
        }
    }

    handleToastClose = () =>
        this.setState({toast: ''});

    generateContent() {
        return null;
    }

    onClick = e => {
        if (!this.closeOnPaperClick) {
            e && e.stopPropagation();
            this.click = Date.now();
        }
    };

    showCloseButton() {
        if (this.props.windowWidth < 500) {
            return <Fab
                size="small"
                aria-label={I18n.t('close')}
                onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.onClose(true)
                }}
                style={Theme.dialog.closeButtonLeft}>
                <CloseIcon/>
            </Fab>;
        } else {
            return null;
        }
    }

    setDialogStyle(style) {
        this.dialogStyle = style || {};
        this.forceUpdate();
    }

    readHistory = async (id, ref) => {
        const now = new Date();
        now.setHours(now.getHours() - 24);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);
        let start = now.getTime();
        let end = Date.now();

        const options = {
            instance: this.props?.systemConfig?.common?.defaultHistory || 'history.0',
            start,
            end,
            step: 1800000,
            from: false,
            ack: false,
            q: false,
            addID: false,
            aggregate: 'minmax'
        };

        return this.props.socket.getHistory(id, options)
            .then(values => {
                // merge range and chart
                let chart = [];
                let r = 0;
                let range = this.rangeValues;
                // let minY = null;
                // let maxY = null;

                for (let t = 0; t < values.length; t++) {
                    if (range) {
                        while (r < range.length && range[r].ts < values[t].ts) {
                            chart.push(range[r]);
                            // console.log(`add ${new Date(range[r].ts).toISOString()}: ${range[r].val}`);
                            r++;
                        }
                    }
                    // if range and details are not equal
                    if (!chart.length || chart[chart.length - 1].ts < values[t].ts) {
                        chart.push(values[t]);
                        // console.log(`add value ${new Date(values[t].ts).toISOString()}: ${values[t].val}`)
                    }
                }

                if (range) {
                    while (r < range.length) {
                        chart.push(range[r]);
                        console.log(`add range ${new Date(range[r].ts).toISOString()}: ${range[r].val}`);
                        r++;
                    }
                }

                // sort
                chart.sort((a, b) => a.ts > b.ts ? 1 : (a.ts < b.ts ? -1 : 0)).filter(e => e.val !== null);
                ref.current?.getEchartsInstance().setOption({
                    series: [{
                        data: this.convertData(chart)
                    }],
                    xAxis: {
                        data: this.convertData(chart)
                    }
                });
            })
            .catch(e => {
                console.error('Cannot read history: ' + e);
            })
    }

    convertData = (values) => {
        return values.map(e => {
            if (e.val !== null) {
                if (typeof e.val === 'boolean') {
                    if (e.val) {
                        return 1;
                    }
                    return 0;
                }
                return e.val;
            }
            return 0;
        });
    }


    getCharts = (id, ref, classes) => {
        //style
        //classes.root
        //classes.name
        //classes.chart
        //
        if (!this.firstGetCharts[id]) {
            this.firstGetCharts[id] = true;
            this.readHistory(id, ref);
        }
        if (!this.expireInSecInterval[id]) {
            this.expireInSecInterval[id] = setInterval(() => {
                this.readHistory(id, ref);
                this.expireInSecInterval[id] = null;
            }, 60000);
        }

        const style = {
            color: '#f85e27',
            areaStyle: '#f85e276b',
        }
        if (this.props.themeName === 'dark') {
            style.color = '#f85e27';
            style.areaStyle = '#f85e276b';
        } else if (this.props.themeName === 'blue') {
            style.color = '#3399CC';
            style.areaStyle = '#3399cc24';
        } else if (this.props.themeName === 'colored') {
            style.color = '#194040';
            style.areaStyle = '#1940406b';
        } else if (this.props.themeName === 'light') {
            style.color = '#020202';
            style.areaStyle = '#0202026b';
        }

        const option = {
            animation: true,
            legend: {
                show: false,
            },
            grid: {
                show: false,
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            },
            xAxis:
                {
                    show: false,
                    boundaryGap: false,
                    data: []
                }
            ,
            yAxis: {
                show: false,
                type: 'value'
            },
            series: [
                {
                    silent: true,
                    type: 'line',
                    smooth: this.props.objects[id] && this.props.objects[id]?.common?.type ? this.props.objects[id]?.common?.type === 'number' : true,
                    step: this.props.objects[id] && this.props.objects[id]?.common?.type ? this.props.objects[id]?.common?.type !== 'number' : false,
                    showSymbol: false,
                    color: style.color,
                    areaStyle: {color: style.areaStyle},
                    data: []
                }
            ]
        };
        let parts = id.split('.');
        return <div key={id} onClick={this.props.openModal ? () => this.props.openModal(id) : null}
                    className={Utils.clsx(cls.wrapperCharts, classes?.root)}>
            <div className={Utils.clsx(cls.chartsName, classes?.name)}>{parts.pop()}</div>
            <ReactEchartsCore
                className={Utils.clsx(cls.styleCharts, classes?.chart)}
                ref={ref}
                echarts={echarts}
                option={option}
                notMerge={true}
                lazyUpdate={true}
                opts={{renderer: 'svg'}}
            />
        </div>;
    }

    render() {
        /*return <div key={this.props.dialogKey + '-dialog'}
                     ref={this.refModal}
                     onClick={() => this.onClose()}
                     style={Theme.dialog.back}>
                <Paper onClick={this.onClick}
                   style={Object.assign({}, Theme.dialog.inner, this.dialogStyle)}
                >
                    {this.generateContent()}
                    <Snackbar
                        key={this.props.dialogKey + '-toast'}
                        anchorOrigin={{vertical: 'top', horizontal: 'right'}}
                        open={!!this.state.toast}
                        onClick={this.handleToastClose}
                        onClose={this.handleToastClose}
                        autoHideDuration={4000}
                        ContentProps={{
                            'aria-describedby': 'message-id',
                        }}
                        message={<span id="message-id">{this.state.toast}</span>}
                    />
                    {this.showCloseButton()}
                </Paper>

            {this.getAdditionalElements && this.getAdditionalElements()}
        </div>;*/
        return <Dialog
            fullWidth
            scroll="paper"
            classes={{
                paper: Utils.clsx('dialog-paper', this.props.classes?.dialogPaper, this.props.transparent ? cls.paper : cls.backgroundDialog),
                root: cls.rootDialog
            }}
            open={!0}
            BackdropProps={{
                classes: {
                    root: cls.filterBlur,
                },
            }}
            onClose={reason => {
                if (!this.getButtons || (reason !== 'backdropClick' && reason !== 'escapeKeyDown')) {
                    this.onClose();
                }
            }}
            maxWidth="sm"
        >
            <div className={cls.filterBlur}/>
            {this.getHeader ? <DialogTitle>{this.getHeader()}</DialogTitle> : null}
            <DialogContent
                className={cls.dialogContent}
                classes={{
                    root: this.props.overflowHidden ? cls.overflowHidden : null,
                }}>
                {this.generateContent()}
            </DialogContent>
            <DialogActions className={cls.dialogActions}>
                {this.getButtons ? this.getButtons() : null}
                {this.getButtons ?
                    <CustomButton onClick={() => this.onClose(true)} variant="contained" autoFocus>
                        <CloseIcon style={{marginRight: 8}}/>{I18n.t('Close')}
                    </CustomButton> :
                    <CustomFab onClick={() => this.onClose(true)} size="small" autoFocus>
                        <CloseIcon/>{/*I18n.t('Close')*/}
                    </CustomFab>}
            </DialogActions>
            {this.getAdditionalElements && this.getAdditionalElements()}
            <Snackbar
                key={this.props.dialogKey + '-toast'}
                anchorOrigin={{vertical: 'top', horizontal: 'right'}}
                open={!!this.state.toast}
                onClick={this.handleToastClose}
                onClose={this.handleToastClose}
                autoHideDuration={4000}
                ContentProps={{'aria-describedby': 'message-id'}}
                message={<span id="message-id">{this.state.toast}</span>}
            />
        </Dialog>
    }
}

export default SmartDialogGeneric;
