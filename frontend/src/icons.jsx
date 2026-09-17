import React from 'react';

export const PillIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a6.5 6.5 0 00-9.192-9.192l-4.243 4.243a6.5 6.5 0 009.192 9.192l4.243-4.243zM10.5 8.5l5 5" />
  </svg>
);

export const SearchIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const DispenseIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

export const AlertIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export const PackageIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export const FileTextIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const CheckIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

export const ClockIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const RefreshIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export const PlusIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

export const TrashIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const ChevronRightIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

export const ChevronDownIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

export const ShieldCheckIcon = ({ size = 18, className = "", ...props }) => (
  <svg width={size} height={size} style={{ width: `${size}px`, height: `${size}px` }} className={`shrink-0 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
