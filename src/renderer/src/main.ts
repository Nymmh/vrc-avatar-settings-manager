import { createApp } from 'vue'
import Notifications from '@kyvg/vue3-notification'
import App from './App.vue'
import { mouseThrottle } from './utils/mouseThrottle'

mouseThrottle()

createApp(App).use(Notifications).mount('#app')
