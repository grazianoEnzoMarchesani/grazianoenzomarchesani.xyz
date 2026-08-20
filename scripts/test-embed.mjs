import { pipeline } from '@xenova/transformers';

async function test() {
  console.log('Caricamento pipeline...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
  console.log('Modello caricato con successo!');
  
  const output = await extractor('Microclimate analysis and urban cooling', { pooling: 'mean', normalize: true });
  console.log('Embedding calcolato! Dimensioni:', output.data.length);
}

test().catch(console.error);
