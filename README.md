# DeroGold Blockchain Explorer
DeroGold Blockchain Explorer v3 - Live site: [explorer.derogold.online](https://explorer.derogold.online/)

### Contributing to DeroGold Blockchain Explorer

We are a community of people across the world giving our time to make this software better. There are many ways you can help or join us:

-   If you'd like to report a bug or have an idea for an improvement, [open an issue](https://github.com/derogold/derogold-explorer/issues/new).
-   If you'd like to submit code for a bug you fixed, [submit a pull-request](https://github.com/derogold/derogold-explorer/compare).
-   **Everyone else just click the ★ star at the top of this repository 😊 It really helps us out!**

For anyone else wishing to help the community or who needs answers to questions not covered in this document, join us in our [Discord Chat](https://discord.com/invite/j2aSNFn) here.

### Running Against the Blockchain Cache API (Default)

By default the explorer is configured to use the hosted middleware API at `https://api.derogold.online`. This is a [blockchain-cache-api](https://github.com/derogold/blockchain-cache-api) microservice that provides enriched data such as pool attribution, payment ID indexing, node monitoring, and historical chain statistics.

No configuration changes are needed to use this mode — just open the explorer in a browser and it works out of the box.

If you want to run your own instance of the blockchain-cache-api and point the explorer at it, update `apiBaseUrl` in `dist/js/config.js`:

```javascript
daemonMode: false,
apiBaseUrl: 'https://your-own-api-host.example.com',
```

### Running Against a Local Daemon

By default the explorer fetches data from the hosted middleware API at `https://api.derogold.online`. If you want to run the explorer against your own local DeroGold daemon instead, you can switch to daemon mode.

#### Requirements

- A running DeroGold daemon started with the `--enable-blockexplorer` flag:
  ```
  ./derogoldd --enable-blockexplorer
  ```
- The daemon RPC port must be reachable from the browser (default: `127.0.0.1:6969`).

#### Enabling daemon mode

Open `dist/js/config.js` and set `daemonMode` to `true`:

```javascript
daemonMode: true,
daemonUrl: 'http://127.0.0.1:6969',
```

If your daemon is running on a different host or port, update `daemonUrl` accordingly.

#### Feature differences in daemon mode

|---------------------------------|-----------------|---------------------------|
| Feature                         | Middleware mode | Daemon mode               |
|---------------------------------|-----------------|---------------------------|
| Dashboard, blocks, transactions | ✅              | ✅                        |
| Charts                          | ✅ Full history | ✅ ~30 most recent blocks |
| Nonce chart                     | ✅              | ❌ Not available          |
| Pool attribution on blocks      | ✅              | ❌ Shows "Unknown"        |
| Node monitor                    | ✅              | ❌ Not available          |
| Mining pools                    | ✅              | ❌ Not available          |
| Payment ID search               | ✅              | ❌ Not available          |
| Mixable amounts                 | ✅              | ❌ Not available          |
| Supply & tools pages            | ✅              | ✅                        |
|---------------------------------|-----------------|---------------------------|

### Credits
- TurtleCoin Developers
- TurtlePay Developers 
- Tabler - [https://github.com/tabler/tabler](https://github.com/tabler/tabler)
- L33d4n - [https://github.com/l33d4n/trtl-explorer](https://github.com/l33d4n/trtl-explorer)
