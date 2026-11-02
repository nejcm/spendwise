import * as React from 'react';

/** 1 when the user moved forward to this step, -1 when they went back. */
export const OnboardingDirectionContext = React.createContext<1 | -1>(1);
