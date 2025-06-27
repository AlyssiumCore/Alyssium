import { ensureImageContainer } from "@/services/storage"

export async function uploadImage(file: File): Promise<string> {
  const container = await ensureImageContainer()
  const blobClient = container.getBlockBlobClient(file.name)

  try {
    // overwrite existing blob if present
    await blobClient.uploadData(await file.arrayBuffer(), {
      blobHTTPHeaders: { blobContentType: file.type },
      overwrite: true
    })
  } catch (err) {
    console.error("Failed to upload image:", err)
    throw new Error("Image upload failed")
  }

  // return URL without SAS token
  return blobClient.url.split("?")[0]
}

export async function deleteImage(fileName: string): Promise<void> {
  const container = await ensureImageContainer()
  const blobClient = container.getBlockBlobClient(fileName)

  try {
    const exists = await blobClient.exists()
    if (exists) {
      await blobClient.delete()
    }
  } catch (err) {
    console.error("Failed to delete image:", err)
    throw new Error("Image deletion failed")
  }
}
