import { notFound } from "next/navigation";
import TestSession from "@/components/TestSession";
import { getChunkDataById, topicIndex } from "@/lib/course-data";

export function generateStaticParams() {
  return topicIndex.topic_sequence.map((chunk) => ({
    chunkId: chunk.id,
  }));
}

export async function generateMetadata({ params }) {
  const { chunkId } = await params;
  const chunkData = getChunkDataById(chunkId);

  if (!chunkData) {
    return {};
  }

  return {
    title: `${chunkData.title} | PROBLEM7`,
    description: `Question set for ${chunkData.title}.`,
  };
}

export default async function TestPage({ params }) {
  const { chunkId } = await params;
  const chunkData = getChunkDataById(chunkId);

  if (!chunkData) {
    notFound();
  }

  return <TestSession key={chunkId} chunkId={chunkId} chunkData={chunkData} />;
}
