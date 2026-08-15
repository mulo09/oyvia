#!/bin/sh
# Builds /etc/nginx/conf.d from the fragments in /etc/nginx/sites.
#
# A site whose certificate is missing is served over plain HTTP so that the
# ACME challenge can succeed; once certbot has issued the certificate the same
# site is switched to "redirect to HTTPS" + an SSL vhost. This is done per
# domain, so one site missing a certificate never stops the other from
# starting.

SITES_DIR=/etc/nginx/sites
CONF_DIR=/etc/nginx/conf.d

# domain names must stay in sync with certbot-entrypoint.sh
SITES="olasyvientos:olasyvientos.es muloborg:muloborg.com"

configure() {
    target_dir=$1
    rm -rf "$target_dir"
    mkdir -p "$target_dir"

    for entry in $SITES; do
        name=${entry%%:*}
        domain=${entry##*:}

        if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
            cp "$SITES_DIR/$name.redirect.conf" "$target_dir/00-$name-redirect.conf"
            cp "$SITES_DIR/$name.ssl.conf" "$target_dir/10-$name-ssl.conf"
        else
            cp "$SITES_DIR/$name.http.conf" "$target_dir/00-$name-http.conf"
        fi
    done
}

fingerprint() {
    cat "$1"/*.conf 2>/dev/null | md5sum
}

configure "$CONF_DIR"
nginx -t || exit 1

# Pick up newly issued or renewed certificates without a manual restart.
watch_certificates() {
    elapsed=0
    while true; do
        sleep 300
        elapsed=$((elapsed + 300))

        configure /tmp/conf.d.next
        if [ "$(fingerprint /tmp/conf.d.next)" != "$(fingerprint $CONF_DIR)" ]; then
            echo "[nginx] certificate state changed, reloading"
            rm -f "$CONF_DIR"/*.conf
            cp /tmp/conf.d.next/*.conf "$CONF_DIR"/
            nginx -t && nginx -s reload
            elapsed=0
        elif [ "$elapsed" -ge 43200 ]; then
            # periodic reload so renewed certificates are re-read
            nginx -s reload
            elapsed=0
        fi
        rm -rf /tmp/conf.d.next
    done
}

watch_certificates &

exec nginx -g 'daemon off;'
