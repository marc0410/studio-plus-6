import { existsSync } from 'node:fs';
import { migrate } from '../lib/database.ts';
import { createUser } from '../lib/auth.ts';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const [email, name, flag] = process.argv.slice(2);
if (!email || !name || (flag && flag !== '--admin')) {
  console.error('Usage : npm run user:create -- email "Prénom Nom" [--admin]');
  process.exit(1);
}
async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) {
    let text = '';
    for await (const part of process.stdin) text += part;
    return text.replace(/\r?\n$/, '');
  }
  process.stdout.write('Mot de passe (12 caractères minimum, saisie masquée) : ');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  return new Promise((resolve, reject) => {
    let password = '';
    const done = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off('data', onData);
      process.stdout.write('\n');
    };
    const onData = (data: string) => {
      for (const character of data) {
        if (character === '\u0003') { done(); reject(Error('Annulé.')); return; }
        if (character === '\r' || character === '\n') { done(); resolve(password); return; }
        if (character === '\u007f' || character === '\b') password = password.slice(0, -1);
        else password += character;
      }
    };
    process.stdin.on('data', onData);
  });
}
try {
  migrate();
  await createUser({ email, name, password: await readPassword(), admin: flag === '--admin' });
  console.log('Compte créé. Vous pouvez vous connecter sur /connexion.');
} catch (error) {
  console.error(String(error).includes('UNIQUE') ? 'Cet e-mail possède déjà un compte.' : error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
