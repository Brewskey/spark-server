/// <reference types="global" />
import type { Application } from 'express';
import { Container } from 'constitute';
declare const app: Application & {
    container: Container;
};
export default app;
