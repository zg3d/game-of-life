const fs = require('fs-extra');
const path = require('path');
const { readDirectory } = require('./memfs');

const distDir = 'dist';
const staticDir = 'static';
fs.emptyDirSync(distDir);
fs.copyFileSync(
  path.join(staticDir, 'robots.txt'),
  path.join(distDir, 'robots.txt')
);
fs.copyFileSync(
  path.join(staticDir, '_redirects'),
  path.join(distDir, '_redirects')
);

const directories =  readDirectory('life');
const generateIndexes = (level, directories) => {
  return directories.reduce((arr, obj) => {
    if (Array.isArray(obj.children)) {
      arr.push({
        level,
        name: obj.name
          .split('-')
          .map((name) => (
            name[0].toUpperCase() +
            name.slice(1)
          ))
          .join(' ')
      });
      generateIndexes(level + 1, obj.children)
        .forEach((v) => arr.push(v));
    } else {
      const paths = obj.path.split(path.sep);
      arr.push({
        name: `_${
          obj.name
            .replace(/\-/g, '_')
            .replace(/\.json$/g, '')
        }`,
        href: `/${
          paths
            .slice(2)
            .join('/')
            .replace(/\.json$/g, '')
        }`,
        path: `../life/${
          paths
            .slice(1)
            .join('/')
        }`
      });
    }
    return arr;
  }, []);
};
const indexes = generateIndexes(2, directories);
const lifes = indexes.filter((life) => !life.level);

fs.writeFileSync(path.join('src', 'index.tsx'), `
import { h, render } from 'preact';
import Router from 'preact-router';
import { Link } from 'preact-router/match';
import Pattern from './pattern';
${lifes
  .map((life) => `
import ${life.name} from '${life.path}';`)
  .join('')}

render((
  <Router>
    <article path='/'>
      <h1>Conway's Game of Life</h1>
      ${indexes.map((life) => life.level ? `
      <h${life.level}>${life.name}</h${life.level}>` : `
      <nav><Link href='${life.href}'>{${life.name}.title}</Link></nav>`
      ).join('')}
    </article>
    ${lifes
      .map((life) => `
    <Pattern path='${life.href}' lifeData={${life.name}} />`)
      .join('')}
  </Router>
), document.getElementById('app'));
`);
