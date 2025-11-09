# `gvm.js` Examples

Explore examples of `gvm.js` integration. Each strategy is contained in its own directory.
Full documentation is available at [docs.wdft.ovh](https://docs.wdft.ovh/gvm-js).

You can either browse the source code or test it using **live-server**:

```sh
# Install live-server if you don't have it
# npm install -g live-server
live-server .  # Then open your browser to view the examples
```

See this repo live at: [gvm.showcase.getviamsg.wdft.ovh](https://gvm.showcase.getviamsg.wdft.ovh)

---

## Hide Strategy

The simplest, all-in-one file solution check: `./hide`. Includes only declarations and script injection.

**Note:** This has commented `data-gvm-cond` for mobile and portrait mode - check it in source, and turn on!

---

## Proxy Strategies

The `./download` directory showcase proxy strategy.
These strategies typically require a backend server or a load balancer with middleware to handle requests before redirecting to a persistent or temporary address.

**Note:** In these examples, the server/proxy part is not included. They demonstrate direct access to files or downloads.

---

There is also `./inject` and `./redirect` strategy that has same way of configuration, and logic. Check docs for available `data-gvm-*` attributes.

## Questions?

These examples are intended as simple showcases for developers.
For more complex use cases or custom examples, post new issue on github or contact our [dev team](mailto:mateusz@wdft.ovh).