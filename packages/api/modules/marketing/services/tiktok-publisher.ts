import { prisma } from "@repo/database";

export async function publishToTikTok(
  organizationId: string,
  videoUrl: string,
  caption: string
) {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        organizationId,
        platform: "tiktok",
        isActive: true,
      },
    });
    
    if (!account) {
      return { success: false, error: "TikTok account not connected" };
    }
    
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      return { success: false, error: "TikTok token expired" };
    }
    
    const initResponse = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/video/init/",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_info: {
            title: caption.substring(0, 150),
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: videoUrl,
          },
        }),
      }
    );
    
    const initData = await initResponse.json();
    
    if (initData.error?.code) {
      return { success: false, error: initData.error.message };
    }
    
    return { success: true, publishId: initData.data?.publish_id };
    
  } catch (error) {
    console.error("TikTok publish error:", error);
    return { success: false, error: String(error) };
  }
}
