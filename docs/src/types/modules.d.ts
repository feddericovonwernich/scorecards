/**
 * Type declarations for external modules and assets
 */

// CSS Module declarations
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Swagger UI type declarations
declare module 'swagger-ui-dist/swagger-ui-bundle' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SwaggerUIBundle: any;
  export default SwaggerUIBundle;
}

declare module 'swagger-ui-dist/swagger-ui-standalone-preset' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SwaggerUIStandalonePreset: any;
  export default SwaggerUIStandalonePreset;
}
