# Use nginx alpine image
FROM nginx:alpine

# Copy custom nginx configuration and the per-domain vhost fragments
COPY ./build/nginx.conf /etc/nginx/nginx.conf
COPY ./build/sites /etc/nginx/sites
COPY ./build/entrypoint.sh /entrypoint.sh

# The stock vhost would answer for every hostname, so it is removed
RUN rm -f /etc/nginx/conf.d/default.conf \
    && mkdir -p /usr/share/nginx/muloborg \
    && chmod +x /entrypoint.sh

# Copy pre-built Angular application
COPY ./dist/oyvia/browser /usr/share/nginx/html

# Google Search Console site verification file. Copied after the app so it
# cannot be clobbered by the build output, and served from the document root
# as https://www.olasyvientos.es/google0f58490df29c1e72.html
COPY ./build/sites/google0f58490df29c1e72.html /usr/share/nginx/html/google0f58490df29c1e72.html

# Expose ports
EXPOSE 80 443

# Start nginx
ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
