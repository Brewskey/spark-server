/// <reference types="global" />
import type { Application as $Application, Application } from 'express';
import type { Container } from 'constitute';
import type { Settings } from './types';
declare function createApp<TApplication extends Application>(container: Container, settings: Settings, existingApp?: TApplication): $Application;
export default createApp;
