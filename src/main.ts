import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

let oldConsole: any = {};
const methods = ['log', 'debug', 'warn', 'info', 'error', 'assert', 'dir', 'profile'];

oldConsole = { ...console };

function disableConsole() {
  oldConsole.clear();
  oldConsole.log(`
                           .s$$             s$
                          s$$$’            s$$
                        .s$$$³´       ,   s$$³
                       s$$$$³      .s$’   $$³
                  ,    $$$$$.      s$³    ³$
                  $   $$$$$$s     s$³     ³,
                 s$   ‘³$$$$$$s   $$$
                 $$    ³$$$$$$s.  ³$$s
                 ³$.    ³$$$$$$$s .s$$$    s´
                 $$.    ³$$$$$$$ $$$$   s³
                  ³$$s    ³$$$$$$s$$$³  s$’
                   ³$$s    $$$$$s$$$$’  s$$
               s.  $$$$   s$$$$$$$$³ .s$$³  s
                $$ s$$$$..s$$$$$$$$$$$$$$³  s$
                s$.s$$$$s$$$$$$$$$$$$$$$$ s$$
               s$$$$$$$$$$$$$$$$$$$$$$$$$$$³
              s$$$ssss$$$$$$$$$$$$$ssss$$$$$´
             $$s§§§§§§§§§s$$$$$$s§§§§§§§§s$,
             ³§§§§§§ Michael $ Madume §§§§§s
             §§§§§§§§§§§§§§§§§§§§§§§§§§§§§§
             ³§§§§§§§§§§§§§§§§§§§§§§§§§§§§§
              ³§§§§§§§§§§§§§§§§§§§§§§§§§§§³
               ³§§§§§§§§§§§§§§§§§§§§§§§§§³
                ³§§§§§§§§§§§§§§§§§§§§§§§³
                  ³§§§§§§§§§§§§§§§§§§§³
                    ³§§§§§§§§§§§§§§§³
                      ³§§§§§§§§§§§³
                         ³§§§§§³
                           ³§³


Logs are Disabled
`);
}



if (environment.production) {
  enableProdMode();

  methods.forEach(val => console[val] = () => { });
  disableConsole();
  
  setInterval(() => {
    disableConsole();
  }, 5000);
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
