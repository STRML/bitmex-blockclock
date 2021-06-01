Simple price pusher to a local Blockclock.

Run with args `<ip> <symbol>`.

#### Building

```
docker buildx build --platform linux/amd64,linux/arm64 --push -t strml/blockclock:<tag> .
```