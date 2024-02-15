import type Controller from '../controllers/Controller';

/* eslint-disable no-param-reassign */
export default () =>
  <TController extends Controller>(
    target: TController,
    name: keyof TController,
  ) => {
    (target[name] as { serverSentEvents: boolean }).serverSentEvents = true;
  };
