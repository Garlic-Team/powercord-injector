exports.getAppDir = async (discordType) => `/Applications/Discord ${discordType.charAt(0).toUpperCase()}${discordType.slice(1)}.app/Contents/Resources/app`;
