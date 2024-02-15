/// <reference types="global" />
import type { Application } from 'express';
import { Container } from 'constitute';
type AppAndContainer = Application & {
    container: Container;
};
export declare const createTestApp: () => AppAndContainer;
export {};
