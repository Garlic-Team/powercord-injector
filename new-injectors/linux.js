const { join } = require('path');
const { existsSync } = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');
const { BasicMessages, AnsiEscapes } = require('./log');

// This is to ensure the homedir we get is the actual user's homedir instead of root's homedir
const homedir = execSync('grep $(logname) /etc/passwd | cut -d ":" -f6').toString().trim();

exports.getAppDir = async (discordType) => {
  const discordTypeFormatted = `${discordType.charAt(0).toUpperCase()}${discordType.slice(1)}`;
  const KnownLinuxPaths = Object.freeze([
    `/usr/share/discord-${discordType}`,
    `/usr/lib64/discord-${discordType}`,
    `/opt/discord-${discordType}`,
    `/opt/Discord${discordTypeFormatted}`,
    `${homedir}/.local/bin/Discord${discordTypeFormatted}` // https://github.com/powercord-org/powercord/pull/370
  ]);

  const discordProcess = execSync('ps x')
    .toString()
    .split('\n')
    .map(s => s.split(' ').filter(Boolean))
    .find(p => p[4] && (/discord-?canary$/i).test(p[4]) && p.includes('--type=renderer'));

  if (!discordProcess) {
    let discordPath = KnownLinuxPaths.find(path => existsSync(path));
    if (!discordPath) {
      const readlineInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const askPath = () => new Promise(resolve => readlineInterface.question('> ', resolve));
      console.log(`${AnsiEscapes.YELLOW}Failed to locate Discord ${discordTypeFormatted} installation folder.${AnsiEscapes.RESET}`, '\n');
      console.log(`Please provide the path of your Discord ${discordTypeFormatted} installation folder`);
      discordPath = await askPath();
      readlineInterface.close();

      if (!existsSync(discordPath)) {
        console.log('');
        console.log(BasicMessages.PLUG_FAILED);
        console.log('The path you provided is invalid.');
        process.exit(process.argv.includes('--no-exit-codes') ? 0 : 1);
      }
    }

    return join(discordPath, 'resources', 'app');
  }

  const discordPath = discordProcess[4].split('/');
  discordPath.splice(discordPath.length - 1, 1);
  return join('/', ...discordPath, 'resources', 'app');
};
