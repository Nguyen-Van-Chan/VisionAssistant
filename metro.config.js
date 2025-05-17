const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('path');

const projectRoot = __dirname;
const workspaceRoot = projectRoot;

const config = getDefaultConfig(projectRoot);

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'axios': resolve(projectRoot, 'node_modules/axios'),
};

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
    resolve(projectRoot, 'node_modules'),
];

module.exports = config; 