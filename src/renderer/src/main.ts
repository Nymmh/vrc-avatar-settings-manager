import { createApp } from 'vue'
import Notifications from '@kyvg/vue3-notification'
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar'
import 'vue3-perfect-scrollbar/style.css'
import App from './App.vue'

createApp(App).use(Notifications).use(PerfectScrollbarPlugin).mount('#app')
