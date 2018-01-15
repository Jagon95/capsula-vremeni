$.fn.embed.settings.sources = {
    youtube: {
        name: 'youtube',
        type: 'video',
        icon: 'video play',
        domain: 'youtube.com',
        url: '//www.youtube.com/embed/{id}',
        parameters: function(settings) {
            return {
                autohide: !settings.brandedUI,
                autoplay: settings.autoplay,
                color: settings.color || undefined,
                hq: settings.hd,
                jsapi: settings.api,
                modestbranding: !settings.brandedUI,
            };
        },
    },
    vk: {
        name: 'vk',
        type: 'video',
        icon: 'video play',
        domain: 'youtube.com',
        url: '//vk.com/video_ext.php?{id}',
    },
};
