import app from './api/index.js'
import { runMigrations } from './src/migrations.js'

const port = Number(process.env.PORT || 8000)

// En desarrollo/local: aplicar migraciones al arrancar el proceso (ORM/Drizzle).
await runMigrations()

app.listen(port, () => {
  console.log(`🚀 Procurement Backend escuchando en http://localhost:${port}`)
})


