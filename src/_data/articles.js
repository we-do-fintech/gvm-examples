/**
 * Shared editorial copy for the "archive / ledger" story used by the
 * hide/blur strategy family. Keeping the prose here means the pages only
 * change the paywall mechanics, never the text.
 */
const ledger = [
    `The ledger lived in a drawer under the cash box, and for forty years that was the entire system. When the printer's bill arrived, the editor drew a line and counted out the year; when a reader wrote asking about an old story, one of the three journalists walked down to the cellar and found the bound volume by hand.`,
    `Then the cellar became a server, and the server got an invoice of its own. By 2024 the digital archive — 38,000 articles, every issue since 1976 — cost more to host each month than the paper earned from its entire online presence. The numbers were small enough to hurt: a few hundred złoty in ad revenue against a hosting bill three times that size.`,
    `The obvious answers were the ones the paper had already tried and rejected. A full annual subscription had stalled at a few hundred members. A newsstand-only model ignored the readers who no longer lived in town — the diaspora of people who had grown up with the Kurier and wanted the town's news, once a week, without buying a bundle they would never finish.`,
    `In December, over coffee, the editor and the two remaining reporters made a list of what the archive held that nobody else did: the 1987 river flood, the school strike, the mill closure, the result of every local football season since 1979. “People don't want all of it,” the editor said. “They want their piece of it.”`,
    `So they ran the smallest possible experiment. The most-requested stories went behind a single-article paywall: price, one złoty ninety-nine; term, forever — once bought, always readable. The checkout was one button and a phone number.`,
    `The second week, the local radio called. The third week, a reader in London bought the 1987 flood story twice — once for herself, once, by mistake, for her brother. The numbers were not yet a business. But for the first time in years, someone was paying for the past.`,
    `The purchase records turned out to be the real discovery. Readers were not buying the front pages — the things the paper still published every week. They were buying the gaps: the issues missing from the bound volumes, the stories that had later been corrected, the five weeks during the mill strike when the paper had almost gone under and stopped printing altogether.`,
    `That was the archive doing work the paper had never understood it was doing. It was not a library of old news; it was the town's only complete record of itself. A woman in Hamburg found her father's obituary and paid for it before she had finished reading the preview. A schoolteacher bought the 1984 spelling contest three times, for three former pupils.`,
    `The economics were unglamorous and, for once, stable. Within six months the archive averaged eleven purchases a day, spread across 340 different articles. A third of buyers came back within the month for a second story. The hosting invoice stopped being a crisis and became a line item the paper could plan around.`,
    `The harder question was workflow. Nobody wanted to build a subscriptions desk for a staff of three, so they did nothing of the kind. The archive ran itself: a story was marked for single-article access the day it was published, and the same price point applied to everything, old or new. The editor kept a single rule taped above the desk — “one honest price, no renewals.”`,
    `They also started marking new stories that they suspected would age well — the history pieces, the investigations, the long profiles — because the data showed readers were far more willing to pay for a story with a second life than for yesterday's news. The present was free. The past had a price.`,
    `A year later the archive was paying for itself, and a little more. The editor framed the first quarterly report and hung it beside the bound volumes in the cellar. Under the numbers, in a hand that had set headlines for four decades, she had written a single line: “The town has started buying its own memory back.”`,
];

module.exports = {
    ledger,
    // Blur-family pages show the first half for free and gate the rest.
    ledgerPreview: ledger.slice(0, 6),
    ledgerPremium: ledger.slice(6),
};
