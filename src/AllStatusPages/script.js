const parser = new DOMParser();

async function fetchAndRenderRSS({feedUrl, containerId}) {
    try {
        const res = await fetch(feedUrl);
        if (!res.ok) throw new Error("RSS fetch failed");
        const text = await res.text();
        const doc = parser.parseFromString(text, "application/xml");

        const items = Array.from(doc.querySelectorAll("item")).slice(0, 5).map(item => ({
            title: item.querySelector("title")?.textContent || "No title",
            link: item.querySelector("link")?.textContent || "#",
            date: item.querySelector("pubDate")?.textContent || "",
            description: item.querySelector("description")?.textContent || ""
        }));

        const list = document.createElement("ul");
        list.className = "mt-2 space-y-4 text-md";

        const rssNotice = document.createElement("p");
        rssNotice.className = "mb-2 text-sm text-gray-600";
        rssNotice.innerText = "📰 RSS/Atom feed status updates:";

        items.forEach(item => {
            if (new Date(item.date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) return; // Skip items older than 7 days
            const li = document.createElement("li");
            li.innerHTML = `
          <a href="${item.link}" target="_blank" class="text-blue-600 font-semibold hover:underline">${item.title}</a>
          <div class="text-xs text-gray-500">${new Date(item.date).toLocaleString()}</div>
          <div class="text-gray-600">${item.description}</div>
        `;
            list.appendChild(li);
        });

        if (!items.length) {
            const noItems = document.createElement("p");
            noItems.className = "text-gray-600 text-sm";
            noItems.innerText = "No recent updates.";
            list.appendChild(noItems);
        }

        const container = document.getElementById(containerId);
        container.appendChild(rssNotice);
        container.appendChild(list);
    } catch (err) {
        console.warn(`Could not load RSS for ${containerId}:`, err);
    }
}

async function fetchAndRenderMultipleRSS({feedUrls, containerId}) {
    try {
        const allItems = [];
        for (const feedUrl of feedUrls) {
            try {
                const res = await fetch(feedUrl);
                if (!res.ok) throw new Error(`RSS fetch failed for ${feedUrl}`);
                const text = await res.text();
                const doc = parser.parseFromString(text, "application/xml");

                const items = Array.from(doc.querySelectorAll("item")).map(item => ({
                    title: item.querySelector("title")?.textContent || "No title",
                    link: item.querySelector("link")?.textContent || "#",
                    date: item.querySelector("pubDate")?.textContent || "",
                    description: item.querySelector("description")?.textContent || ""
                }));

                allItems.push(...items);
            } catch (feedErr) {
                console.warn(`Error fetching ${feedUrl}:`, feedErr);
            }
        }

        // Sort items by date (descending)
        allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

        const list = document.createElement("ul");
        list.className = "mt-2 space-y-4 text-md";

        const rssNotice = document.createElement("p");
        rssNotice.className = "mb-2 text-sm text-gray-600";
        rssNotice.innerText = "📰 Aggregated RSS/Atom feed status updates:";

        const recentItems = allItems.filter(item =>
            new Date(item.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).slice(0, 10);

        recentItems.forEach(item => {
            if (new Date(item.date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) return; // Skip items older than 7 days
            const li = document.createElement("li");
            li.innerHTML = `
                    <a href="${item.link}" target="_blank" class="text-blue-600 font-semibold hover:underline">${item.title}</a>
                    <div class="text-xs text-gray-500">${new Date(item.date).toLocaleString()}</div>
                    <div class="text-gray-600">${item.description}</div>
                `;
            list.appendChild(li);
        });

        if (!recentItems.length) {
            const noItems = document.createElement("p");
            noItems.className = "text-gray-600 text-sm";
            noItems.innerText = "No recent updates.";
            list.appendChild(noItems);
        }

        const container = document.getElementById(containerId);
        container.appendChild(rssNotice);
        container.appendChild(list);
    } catch (err) {
        console.warn(`Could not load RSS feeds for ${containerId}:`, err);
    }
}

fetchAndRenderRSS({
    feedUrl: "https://status.aws.amazon.com/rss/all.rss",
    containerId: "aws-card"
});

fetchAndRenderRSS({
    feedUrl: "https://api.codetabs.com/v1/proxy?quest=https://status.hashicorp.com/feed.rss",
    containerId: "hashi-card"
});

const ovhFeeds = [
    "https://web-cloud.status-ovhcloud.com/history.rss",
    "https://public-cloud.status-ovhcloud.com/history.rss",
    "https://hosted-private-cloud.status-ovhcloud.com/history.rss",
    "https://bare-metal-servers.status-ovhcloud.com/history.rss",
    "https://network.status-ovhcloud.com/history.rss",
    "https://customer-service.status-ovhcloud.com/history.rss"
];

fetchAndRenderMultipleRSS({
    feedUrls: ovhFeeds,
    containerId: "ovh-card"
});
