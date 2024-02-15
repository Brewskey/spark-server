import createApp from '../../app';
import settings from './settings';
import getDefaultContainer from './getDefaultContainer';
var container = getDefaultContainer();
var app = createApp(container, settings);
app.container = container;
export default app;
//# sourceMappingURL=testApp.js.map