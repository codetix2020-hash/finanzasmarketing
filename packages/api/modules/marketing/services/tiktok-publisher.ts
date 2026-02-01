import { prisma } from "@repo/database";

interface TikTokPublishResult {
  success: boolean;
  publishId?: string;
  error?: string;
}

export async function publishToTikTok(
  organizationId: string,
  videoUrl: string,
  caption: string
): Promise<TikTokPublishResult> {
  try {
    // Get TikTok account
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
    
    // Check if token is expired
    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      // TODO: Implement token refresh
      return { success: false, error: "TikTok token expired, please reconnect" };
    }
    
    // Step 1: Initialize video upload
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
            title: caption.substring(0, 150), // TikTok limit
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
    console.log("TikTok publish init response:", initData);
    
    if (initData.error?.code) {
      return { 
        success: false, 
        error: initData.error.message || "Failed to initialize TikTok upload" 
      };
    }
    
    const publishId = initData.data?.publish_id;
    
    if (!publishId) {
      return { success: false, error: "No publish ID returned from TikTok" };
    }
    
    return { success: true, publishId };
    
  } catch (error) {
    console.error("TikTok publish error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function checkTikTokPublishStatus(
  organizationId: string,
  publishId: string
): Promise<{ status: string; error?: string }> {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        organizationId,
        platform: "tiktok",
        isActive: true,
      },
    });
    
    if (!account) {
      return { status: "error", error: "Account not found" };
    }
    
    const response = await fetch(
      `https://open.tiktokapis.com/v2/post/publish/status/fetch/`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${account.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publish_id: publishId }),
      }
    );
    
    const data = await response.json();
    return { status: data.data?.status || "unknown" };
    
  } catch (error) {
    return { status: "error", error: String(error) };
  }
}

