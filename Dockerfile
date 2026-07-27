# Static site — nginx
FROM nginx:1.27-alpine

# Remove default nginx site content
RUN rm -rf /usr/share/nginx/html/*

# Custom nginx config (SPA-friendly static hosting)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Site files
COPY index.html styles.css app.js robots.txt sitemap.xml /usr/share/nginx/html/
COPY images/ /usr/share/nginx/html/images/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
