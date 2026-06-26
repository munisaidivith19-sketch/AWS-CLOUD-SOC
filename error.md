[plugin:vite:oxc] Transform failed with 13 errors:

[PARSE_ERROR] Identifier `BrowserRouter` has already been declared
    ╭─[ src/App.tsx:1:10 ]
    │
  1 │ import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
    │          ──────┬──────  
    │                ╰──────── `BrowserRouter` has already been declared here
    │ 
 41 │ }import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
    │           ──────┬──────  
    │                 ╰──────── It can not be redeclared here
────╯

[PARSE_ERROR] Identifier `Routes` has already been declared
    ╭─[ src/App.tsx:1:25 ]
    │
  1 │ import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
    │                         ───┬──  
    │                            ╰──── `Routes` has already been declared here
    │ 
 41 │ }import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
    │                          ───┬──  
    │                             ╰──── It can not be redeclared here
────╯

[PARSE_ERROR] Identifier `Route` has already been declared
    ╭─[ src/App.tsx:1:33 ]
    │
  1 │ import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
    │                                 ──┬──  
    │                                   ╰──── `Route` has already been declared here
    │ 
 41 │ }import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
    │                                  ──┬──  
    │                                    ╰──── It can not be redeclared here
────╯

[PARSE_ERROR] Identifier `Navigate` has already been declared
    ╭─[ src/App.tsx:1:40 ]
    │
  1 │ import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
    │                                        ────┬───  
    │                                            ╰───── `Navigate` has already been declared here
    │ 
 41 │ }import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
    │                                         ────┬───  
    │                                             ╰───── It can not be redeclared here
────╯

[PARSE_ERROR] Identifier `AuthProvider` has already been declared
    ╭─[ src/App.tsx:2:10 ]
    │
  2 │ import { AuthProvider, useAuth } from './context/AuthContext'
    │          ──────┬─────  
    │                ╰─────── `AuthProvider` has already been declared here
    │ 
 42 │ import { AuthProvider, useAuth } from './context/AuthContext'
    │          ──────┬─────  
    │                ╰─────── It can not be redeclared here
────╯

...
D:/POJECTS/AI ATDDENCE/aws-cloud-soc/frontend/src/App.tsx
    at transformWithOxc (file:///D:/POJECTS/AI%20ATDDENCE/aws-cloud-soc/frontend/node_modules/vite/dist/node/chunks/node.js:3657:19)
    at TransformPluginContext.transform (file:///D:/POJECTS/AI%20ATDDENCE/aws-cloud-soc/frontend/node_modules/vite/dist/node/chunks/node.js:3728:26)
    at EnvironmentPluginContainer.transform (file:///D:/POJECTS/AI%20ATDDENCE/aws-cloud-soc/frontend/node_modules/vite/dist/node/chunks/node.js:29699:51)
    at async loadAndTransform (file:///D:/POJECTS/AI%20ATDDENCE/aws-cloud-soc/frontend/node_modules/vite/dist/node/chunks/node.js:19725:26)
    at async viteTransformMiddleware (file:///D:/POJECTS/AI%20ATDDENCE/aws-cloud-soc/frontend/node_modules/vite/dist/node/chunks/node.js:24149:20)
Click outside, press Esc key, or fix the code to dismiss.
You can also disable this overlay by setting server.hmr.overlay to false in vite.config.ts.