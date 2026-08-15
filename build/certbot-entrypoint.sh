#!/bin/sh
# Issues (and then keeps renewing) one certificate per domain. Separate
# certificates are used on purpose so that each one lands in
# /etc/letsencrypt/live/<domain>/, which is the path the nginx vhosts expect.

EMAIL=muloborg@protonmail.com
WEBROOT=/var/lib/letsencrypt

echo "Waiting for nginx to start..."
sleep 15

issue() {
    domain=$1
    shift

    if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
        echo "Certificate for $domain already present, skipping issuance"
        return 0
    fi

    echo "Requesting certificate for $domain..."
    if certbot certonly --webroot --webroot-path="$WEBROOT" \
        --email "$EMAIL" --agree-tos --no-eff-email "$@"; then
        echo "Certificate obtained for $domain"
    else
        echo "Could not obtain a certificate for $domain (check DNS and ports 80/443)"
    fi
}

issue_all() {
    issue olasyvientos.es -d olasyvientos.es -d www.olasyvientos.es
    issue muloborg.com -d muloborg.com -d www.muloborg.com
}

issue_all

# Retry failed domains and renew the existing ones twice a day.
while true; do
    sleep 43200
    certbot renew --webroot --webroot-path="$WEBROOT" --quiet
    issue_all
done
