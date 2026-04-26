require('dotenv').config();
const { Client } = require('minio');

const host = process.env.MINIO_HOST;
const parsed = new URL(host);

const client = new Client({
  endPoint: parsed.hostname,
  port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
  useSSL: host.startsWith('https://'),
  accessKey: process.env.MINIO_USER,
  secretKey: process.env.MINIO_PASSWORD,
});

const bucket = process.env.MINIO_BUCKET;

async function run() {
  console.log(`Endpoint : ${parsed.hostname}:${process.env.MINIO_PORT}`);
  console.log(`AccessKey: ${process.env.MINIO_USER}`);
  console.log(`Bucket   : ${bucket}\n`);

  // 1. List buckets — valida credenciales
  try {
    const buckets = await client.listBuckets();
    console.log(`✓ listBuckets OK — buckets visibles: ${buckets.map(b => b.name).join(', ') || '(ninguno)'}`);
  } catch (e) {
    console.error(`✗ listBuckets FAILED: ${e.message}`);
    process.exit(1);
  }

  // 2. bucketExists — valida acceso al bucket específico
  try {
    const exists = await client.bucketExists(bucket);
    console.log(`${exists ? '✓' : '✗'} bucketExists('${bucket}'): ${exists ? 'existe' : 'NO existe — crealo en la consola de MinIO'}`);
    if (!exists) process.exit(1);
  } catch (e) {
    console.error(`✗ bucketExists FAILED: ${e.message}`);
    process.exit(1);
  }

  // 3. statObject con key inexistente — valida permisos de lectura en el bucket
  try {
    await client.statObject(bucket, '__check__');
    console.log(`✓ permisos de lectura OK`);
  } catch (e) {
    if (e.code === 'NotFound' || e.message?.includes('does not exist')) {
      console.log(`✓ permisos de lectura OK (objeto no encontrado, como se esperaba)`);
    } else {
      console.error(`✗ statObject FAILED: ${e.message} — el usuario no tiene permisos de lectura en el bucket`);
    }
  }

  // 4. putObject con objeto de prueba — valida permisos de escritura
  const testKey = '__write-check__';
  try {
    const { Readable } = require('stream');
    const buf = Buffer.from('test');
    await client.putObject(bucket, testKey, Readable.from(buf), buf.length);
    console.log(`✓ putObject OK — el usuario tiene permisos de escritura`);
    await client.removeObject(bucket, testKey).catch(() => {});
  } catch (e) {
    console.error(`✗ putObject FAILED: ${e.message}`);
    console.error(`  → El usuario no tiene s3:PutObject en el bucket.`);
    console.error(`  → Fix: consola MinIO → Identity → Users → ${process.env.MINIO_USER} → Policies → asignar "readwrite"`);
  }

  console.log('\nDone.');
}

run();
