// eslint-disable-next-line no-unused-vars
import { merge } from 'lodash';
import Printer from './components/Printer';

const defaultOptions = {};

const plugin = {
  install(Vue, opts) {
    Vue.rgGlobals = Vue.rgGlobals || {};
    Vue.rgGlobals.dynamicPrinter = {
      VERSION: '0.0.1',
    };
    // merge default options with arg options
    const options = merge(defaultOptions, opts);

    Vue.component("RgDynamicPrinter", Printer);

    console.log('Printer plugin installed', options);
  },
};

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin)
}

export default plugin;
