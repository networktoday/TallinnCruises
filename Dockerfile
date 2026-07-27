# Static image serving the pre-built site.
# Run the Vite build on the host BEFORE building this image
# (see deploy/deploy.sh):
#   PORT=5000 BASE_PATH=/ pnpm --filter @workspace/tallinn-shore-tours run build
FROM nginx:alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY artifacts/tallinn-shore-tours/dist/public /usr/share/nginx/html
