import { Client } from '@elastic/elasticsearch';

const esNode = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

export const esClient = new Client({
  node: esNode,
  requestTimeout: 5000,
});

const INDEX_NAME = 'sent_emails';

export async function initElasticsearch(): Promise<boolean> {
  try {
    const health = await esClient.cluster.health({});
    console.log(`[Elasticsearch] Cluster status: ${health.status}`);

    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              emailJobId: { type: 'keyword' },
              recipient: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              subject: { type: 'text', analyzer: 'standard' },
              body: { type: 'text', analyzer: 'standard' },
              sentAt: { type: 'date' },
              etherealMsgId: { type: 'keyword' },
              previewUrl: { type: 'keyword' },
            },
          },
        },
      });
      console.log(`[Elasticsearch] Index '${INDEX_NAME}' created`);
    }
    return true;
  } catch (error: any) {
    console.warn('[Elasticsearch] Init warning/unavailable:', error.message);
    return false;
  }
}

export async function indexSentEmail(document: {
  id: string;
  userId: string;
  emailJobId: string;
  recipient: string;
  subject: string;
  body: string;
  sentAt: Date;
  etherealMsgId?: string | null;
  previewUrl?: string | null;
}) {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: document.id,
      document: {
        ...document,
        sentAt: document.sentAt.toISOString(),
      },
    });
    console.log(`[Elasticsearch] Indexed sent email ID: ${document.id}`);
  } catch (error: any) {
    console.error('[Elasticsearch] Failed to index document:', error.message);
    // Silent fail to preserve application state integrity
  }
}

export async function searchSentEmails(
  userId: string,
  query: string
): Promise<any[]> {
  try {
    if (!query || query.trim() === '') {
      const response = await esClient.search({
        index: INDEX_NAME,
        query: {
          term: { userId: userId },
        },
        sort: [{ sentAt: { order: 'desc' } }],
        size: 50,
      });
      return response.hits.hits.map((hit) => hit._source);
    }

    const response = await esClient.search({
      index: INDEX_NAME,
      query: {
        bool: {
          must: [
            { term: { userId: userId } },
            {
              multi_match: {
                query: query,
                fields: ['subject^3', 'body', 'recipient^2'],
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      },
      sort: [{ sentAt: { order: 'desc' } }],
      size: 50,
    });

    return response.hits.hits.map((hit) => hit._source);
  } catch (error: any) {
    console.error('[Elasticsearch] Search query failed:', error.message);
    return [];
  }
}
