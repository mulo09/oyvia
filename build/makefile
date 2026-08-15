define setup_env
    $(eval include .env)
    $(eval export)
endef

clean:
	-sudo docker stop $$(sudo docker ps -a -q) 2>/dev/null || true
	-sudo docker rm $$(sudo docker ps -a -q) 2>/dev/null || true
	-docker rmi -f $$(docker images -q) 2>/dev/null || true
	-docker volume prune -f

start:
	docker compose -f ./docker-compose.yml -p oyv-service-front up --build --detach

stop:
	docker compose -f ./docker-compose.yml -p oyv-service-front down --remove-orphans

# Directory on the EC2 host that nginx serves for muloborg.com
MULOBORG_HTML ?= /opt/muloborg/html
MULOBORG_IMAGE ?= mulo09/muloborg:latest
# On the EC2 host docker usually needs root: `make sync-muloborg DOCKER="sudo docker"`
DOCKER ?= docker
# Container name of the nginx that serves both sites
NGINX_CONTAINER ?= oyvfront
# Set to empty when the target directory is already writable by the user
SUDO ?= sudo
# Set to no to use an image that is already present locally
PULL ?= yes

# Copies the built muloborg app out of its image into the directory the
# oyvfront nginx container mounts, then reloads nginx.
#
# The target directory is emptied in place rather than deleted and recreated:
# a running container's bind mount keeps pointing at the original inode, so
# `rm -rf` on the directory itself would leave nginx staring at a detached,
# permanently empty directory until the container is restarted.
sync-muloborg:
	@if [ "$(PULL)" = "yes" ]; then $(DOCKER) pull $(MULOBORG_IMAGE); fi
	$(SUDO) rm -rf $(MULOBORG_HTML).new
	$(SUDO) mkdir -p $(MULOBORG_HTML).new $(MULOBORG_HTML)
	cid=$$($(DOCKER) create $(MULOBORG_IMAGE)); \
	$(DOCKER) cp $$cid:/usr/share/nginx/html/. $(MULOBORG_HTML).new/ && \
	$(DOCKER) rm $$cid
	test -f $(MULOBORG_HTML).new/index.html
	$(SUDO) find $(MULOBORG_HTML) -mindepth 1 -delete
	$(SUDO) cp -a $(MULOBORG_HTML).new/. $(MULOBORG_HTML)/
	$(SUDO) rm -rf $(MULOBORG_HTML).new
	$(SUDO) chmod -R a+rX $(MULOBORG_HTML)
	-$(DOCKER) exec $(NGINX_CONTAINER) nginx -s reload
	@echo "muloborg files synced to $(MULOBORG_HTML)"

bounce:
	docker compose -f ./build/docker-compose.yml -p betcoreapi-service down --remove-orphans
	docker compose -f ./build/docker-compose.yml -p betcoreapi-service up --build --detach
start-local: local-env
	go run cmd/betcoreapi/main.go

run-local: local-env
	./main

build-oyv:
	 GO111MODULE=on go build ./cmd/main.go

test-sociable-api:
	go test ./internal/... -v

gen-mock-db:
    GO111MODULE=on mockgen --build_flags=--mod=mod -destination=./internal/adapters/db/dbmock.go -package db -source=./internal/ports/db.go

gen-mock-pc:
    GO111MODULE=on mockgen --build_flags=--mod=mod -destination=./internal/adapters/payoutcalc/payoutcalcmock.go -package payoutcalc -source=./internal/ports/external/payoutcalc.go

gen-mock-nats:
    GO111MODULE=on mockgen --build_flags=--mod=mod -destination=./internal/adapters/nats/natsmock.go -package nats -source=./internal/ports/nats.go

gen-mock-swixrisk:
    GO111MODULE=on mockgen --build_flags=--mod=mod -destination=./internal/adapters/swixrisk/srmock.go -package swixrisk -source=./internal/ports/swixrisk.go

gen-swagger:
	swag init --parseDependency --parseInternal --parseDepth 1 -g internal/adapters/http/server.go -o api/docs

# Common utilities
docker-clean:
	@docker system prune --volumes --force
