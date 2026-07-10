/** Shared OpenAPI document config. `servers: [{ url: '/' }]` means clients inject origin via baseUrl. */
export const openApiConfig = {
  openapi: '3.0.0' as const,
  info: { title: 'Scaffold API', version: '1.0.0' },
  servers: [{ url: '/' }],
}
