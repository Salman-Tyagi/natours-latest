import path from 'path';

export default {
  entry: './public/js/index.js',
  output: {
    path: path.resolve('public/js/'),
    filename: 'bundle.js',
  },
  mode: 'production',
};
