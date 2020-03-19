import * as React from "react";

function SvgThermometer(props) {
  return (
    <svg width={45.659} height={45.659} {...props}>
      <path d="M30.619 27.309V7.781C30.619 3.49 27.124 0 22.833 0c-4.29 0-7.785 3.491-7.785 7.78v19.528a10.722 10.722 0 00-3.05 7.522c0 5.972 4.857 10.828 10.829 10.828 5.97 0 10.834-4.856 10.834-10.828 0-2.918-1.141-5.572-3.042-7.521zM22.825 42.66c-4.316 0-7.824-3.512-7.824-7.828 0-2.527 1.174-4.779 3.077-6.211V16.237h3.372c.552 0 1-.47 1-1.022 0-.553-.448-1.021-1-1.021h-3.372v-2.466h3.372c.552 0 1-.434 1-.986a.989.989 0 00-1-.986h-3.372V7.78c0-2.636 2.119-4.78 4.754-4.78 2.637 0 4.756 2.144 4.756 4.781v20.871c1.903 1.434 3.047 3.671 3.047 6.18 0 4.316-3.494 7.828-7.81 7.828z" />
      <path d="M25.334 30.463V18.632h-5.002v11.831a4.973 4.973 0 00-2.537 4.369 5.038 5.038 0 005.038 5.046 5.034 5.034 0 005.034-5.046c0-1.866-.982-3.495-2.533-4.369z" />
    </svg>
  );
}

export default SvgThermometer;
