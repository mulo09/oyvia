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

# ---------------------------------------------------------------------------
# Instagram: genera el post de un artículo publicado en olasyvientos.es
#
#   make -f build/makefile post id=97
#   cd build && make post id=97
#   make post id=97 title="Titular a medida"
#
# Requisitos: Node 18+ y Google Chrome instalado.
# Salida: build/instagram/post-article-<id>.png (+ .txt)
# ---------------------------------------------------------------------------

# Raíz del repo calculada desde la ubicación de este makefile, para que los
# targets funcionen tanto desde build/ como desde la raíz.
ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))..)
IG_DIR := $(ROOT)/build/instagram
IG_TEMPLATES := $(IG_DIR)/templates

.PHONY: post ig-open ig-templates

post:
ifndef id
	$(error Falta el id del articulo. Uso: make post id=97)
endif
	@cd $(IG_TEMPLATES) && node generate-post.mjs $(id) $(if $(title),--title "$(title)",)

# Abre el PNG generado para revisarlo antes de publicar.
ig-open:
ifndef id
	$(error Falta el id del articulo. Uso: make ig-open id=97)
endif
	@open $(IG_DIR)/post-article-$(id).png

# Re-exporta las plantillas de ejemplo (carrusel, reels, stories, perfil).
ig-templates:
	@cd $(IG_TEMPLATES) && ./render.sh

# ---------------------------------------------------------------------------
# Video: descarga y codifica un clip para el banner Stage (build/youtube/encode-web.sh)
#
# Forma corta (4 parametros, sin flags):
#   make -f build/makefile video args='https://youtu.be/fUYJC70G43o 10:11:59 10:12:19 teahupoo'
#   make -f build/makefile video args='build/youtube/videex_master.mp4 videex'
#
# Forma con variables:
#   make -f build/makefile video u="https://youtu.be/fUYJC70G43o" s=10:11:59 e=10:12:19 name=teahupoo
#   cd build && make video i=clip.mp4 name=teahupoo
#   make video u=<url> s=1:00:00 e=1:00:20 k=1 name=teahupoo
#
# Parametros (los mismos que el script):
#   u=<url>    URL de YouTube (requiere s y e)
#   s=<time>   inicio hh:mm:ss
#   e=<time>   fin    hh:mm:ss
#   i=<file>   usa un fichero local en vez de descargar
#   k=1        conserva el master descargado
#   name=<n>   nombre base de salida (obligatorio)
#
# Nota: make no admite ':' ni '//' en los objetivos, por eso la URL y los
# tiempos van en args='...' o en variables, no sueltos tras "video".
# Nota 2: no uses "make -n", es una simulacion (dry-run) y no ejecuta nada.
# Las URLs con '&' (p.ej. ...watch?v=ID&t=123s) funcionan tal cual dentro de
# args='...': el target las trocea solo por espacios, sin interpretar el shell.
#
# Requisitos: yt-dlp (solo con URL) y ffmpeg.
# ---------------------------------------------------------------------------
#make -f build/makefile video args='https://www.youtube.com/watch?v=Mt4qlqsjHMA&t=2523s 00:42:26 00:42:48 panoramic'
ENCODE_WEB := $(ROOT)/build/youtube/encode-web.sh

.PHONY: video

video:
ifdef args
	@VIDEO_ARGS='$(args)' bash -c 'IFS=" "; set -f; set -- $$VIDEO_ARGS; set +f; bash "$(ENCODE_WEB)" "$$@"'
else
ifndef name
	$(error Falta name. Uso: make video u=<url> s=<start> e=<end> name=<nombre>)
endif
	@VIDEO_U='$(u)' VIDEO_S='$(s)' VIDEO_E='$(e)' VIDEO_I='$(i)' VIDEO_K='$(k)' VIDEO_NAME='$(name)' \
		bash -c 'set -- ; \
			[ -n "$$VIDEO_U" ] && set -- "$$@" -u "$$VIDEO_U"; \
			[ -n "$$VIDEO_S" ] && set -- "$$@" -s "$$VIDEO_S"; \
			[ -n "$$VIDEO_E" ] && set -- "$$@" -e "$$VIDEO_E"; \
			[ -n "$$VIDEO_I" ] && set -- "$$@" -i "$$VIDEO_I"; \
			[ -n "$$VIDEO_K" ] && set -- "$$@" -k; \
			bash "$(ENCODE_WEB)" "$$@" "$$VIDEO_NAME"'
endif

