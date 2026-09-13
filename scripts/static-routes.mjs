import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {routes} from '../js/content.js';
const html=await readFile('dist/index.html','utf8');
for(const route of routes.filter(route=>route!=='home')){
  await mkdir(`dist/${route}`,{recursive:true});
  const title=route[0].toUpperCase()+route.slice(1);
  await writeFile(`dist/${route}/index.html`,html.replace('<title>Adnan Shaikh / Software Developer</title>',`<title>${title} / Adnan Shaikh</title>`));
}
await writeFile('dist/404.html',html);
await writeFile('dist/.nojekyll','');
for(const file of ['img','adnanmaz@usc.edu.pdf']) await cp(file,`dist/${file}`,{recursive:true});
console.log('Static routes and original portfolio assets are ready in dist/.');
