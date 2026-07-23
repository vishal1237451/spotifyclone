import { serve } from '@hono/node-server'
import app from './dist/server.js'

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`JioSaavn API running at http://localhost:${info.port}`)
})
