import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  loadBrandSettings,
  saveBrandSettings,
  clearBrandSettingsCache,
  BrandSettings,
} from '@/lib/settings/brand-settings';
import { getAllTemplates } from '@/lib/templates';

/**
 * GET /api/settings/brands
 * Get all brand settings and available templates
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandSettings = await loadBrandSettings();
    const availableTemplates = getAllTemplates().map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
    }));

    return NextResponse.json({
      brandSettings,
      availableTemplates,
    });
  } catch (error) {
    console.error('Error getting brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to load brand settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/brands
 * Update brand settings
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { brandSettings } = body as { brandSettings: Record<string, BrandSettings> };

    if (!brandSettings || typeof brandSettings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid brand settings format' },
        { status: 400 }
      );
    }

    // Validate that default exists
    if (!brandSettings.default) {
      return NextResponse.json(
        { error: 'Default brand settings are required' },
        { status: 400 }
      );
    }

    // Validate template IDs
    const availableTemplates = getAllTemplates().map((t) => t.id);
    for (const [brand, settings] of Object.entries(brandSettings)) {
      if (!availableTemplates.includes(settings.templateId)) {
        return NextResponse.json(
          { error: `Invalid template ID: ${settings.templateId} for brand: ${brand}` },
          { status: 400 }
        );
      }
    }

    // Save settings
    await saveBrandSettings(brandSettings);
    clearBrandSettingsCache();

    return NextResponse.json({
      success: true,
      message: 'Brand settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to update brand settings' },
      { status: 500 }
    );
  }
}
