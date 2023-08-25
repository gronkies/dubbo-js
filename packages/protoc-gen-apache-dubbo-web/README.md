# protoc-gen-apache-dubbo-web

This package is deprecated.

The code generator `protoc-gen-apache-dubbo-web` can now be used for Dubbo on the 
Web, and for Dubbo on Node.js.  
For a better fit, we have renamed it to `protoc-gen-apache-dubbo-web` in 
[dubbo-js](https://github.com/apache/dubbo-js). 

The generated code is actually exactly the same, so it is not necessary to 
update right away, but we are not going to maintain this package anymore.

Switching to [protoc-gen-apache-dubbo-web](https://www.npmjs.com/package/protoc-gen-apache-dubbo-web) 
is straight-forward:

```bash
npm remove protoc-gen-apache-dubbo-es
npm install protoc-gen-apache-dubbo-web
```

Update your `buf.gen.yaml`:

```diff
version: v1
plugins:
  - plugin: es
    out: src/gen
-  - plugin: connect-web
+  - plugin: apache-dubbo-es
    out: src/gen
```

And your import paths:

```diff
- import { ElizaService } from "gen/eliza_dubboweb";
+ import { ElizaService } from "gen/eliza_dubbo";
```
