import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue/dist/bootstrap-vue.esm';
import _ from 'lodash';
import d3 from 'd3';
import moment from 'moment';
import App from './App.vue';

// Import the styles directly. (Or you could add them via script tags.)
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';


Vue.use(BootstrapVue);

new Vue({
  el: '#app',
  render: h => h(App)
});
