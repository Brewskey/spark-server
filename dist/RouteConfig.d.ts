/// <reference types="global" />
import type { Application as $Application } from 'express';
import type { Container } from 'constitute';
import { type Settings } from './types';
declare const _default: (app: $Application, container: Container, controllers: Array<string>, settings: Settings) => void;
export default _default;
