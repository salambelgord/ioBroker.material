import React, { useEffect, useState } from 'react';
import { I18n, Utils } from '@iobroker/adapter-react-v5';

import cls from './style.module.scss';

const standardOptions = {
    hour: '2-digit',
    minute: '2-digit',

}
const showSecondsOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
}

const format = (x, y) => {
    let z = {
        M: x.getMonth() + 1,
        d: x.getDate(),
        h: x.getHours(),
        m: x.getMinutes(),
        s: x.getSeconds()
    };
    y = y.replace(/(M+|d+|h+|m+|s+)/g, (v) => {
        return ((v.length > 1 ? "0" : "") + z[v.slice(-1)]).slice(-2)
    });

    return y.replace(/(y+)/g, (v) => {
        return x.getFullYear().toString().slice(-v.length)
    });
}

const Clock = ({
    secondsParams,
    hour12Params,
    dayOfWeekParams,
    date,
    doubleSize,
    noBigClock
}) => {
    let subscribeTime = null;

    // const [showSeconds, setShowSeconds] = useState(!!secondsParams);
    // const [hour12, setHour12] = useState(!!hour12Params);
    const [dayOfWeek, setDayOfWeek] = useState(!!dayOfWeekParams ? new Intl.DateTimeFormat(I18n.getLanguage(), { weekday: 'long' }).format(new Date()) : null);
    const [time, setTime] = useState(new Date().toLocaleTimeString(I18n.getLanguage(),
        Object.assign(secondsParams ? showSecondsOptions : standardOptions, { hour12: hour12Params })));

    const updateTime = () => {
        const newTime = new Date().toLocaleTimeString(I18n.getLanguage(), Object.assign(secondsParams ? showSecondsOptions : standardOptions, {
            hour12: hour12Params
        }));
        setTime(newTime.replace(/[AP]M/gi, " "));
        if (dayOfWeekParams) {
            setDayOfWeek(new Intl.DateTimeFormat(I18n.getLanguage(), { weekday: 'long' }).format(new Date()));
        }
    }

    useEffect(() => {
        if (subscribeTime) {
            clearInterval(subscribeTime);
        }
        subscribeTime = setInterval(updateTime, 100);
        return () => {
            if (subscribeTime) {
                clearInterval(subscribeTime);
            }
        }
    }, [hour12Params, secondsParams]);

    return <div className={Utils.clsx(cls.clockWrapper, noBigClock && cls.noBigClock)}>
        <div className={Utils.clsx(cls.clock, !secondsParams && cls.noWidth, !doubleSize && cls.clockSmall)}>
            <div className={Utils.clsx(cls.timeWrapper, !doubleSize && cls.timeWrapperSmall, !secondsParams && !doubleSize && cls.clockBigSmall)}>
                {time}{hour12Params && <span>pm</span>}
            </div>
        </div>
        <div className={Utils.clsx(cls.dayOfWeek, !dayOfWeek && cls.emptyDayOfWeek, !doubleSize && cls.dayOfWeekSmall)}>
            {dayOfWeek}{date && <span>{format(new Date(), 'dd.MM.yyyy')}</span>}
        </div>
    </div>
}

Clock.defaultProps = {
    secondsParams: false,
    hour12Params: false,
    dayOfWeekParams: false,
    date: false,
    doubleSize: false,
    noBigClock: false
};

export default Clock;