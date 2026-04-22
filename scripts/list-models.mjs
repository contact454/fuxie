const API_KEY = 'AIzaSyCuXbcaixBgUzc64JxwaaQ4QJ2KtEDGgEw';

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1alpha/models?key=${API_KEY}`);
        const data = await response.json();
        
        if (data.models) {
            const bidiModels = data.models.filter(m => 
                m.supportedGenerationMethods && m.supportedGenerationMethods.includes('bidiGenerateContent')
            );
            console.log('Models supporting bidiGenerateContent:');
            bidiModels.forEach(m => console.log(`- ${m.name}`));
            
            console.log('\nAll models starting with models/gemini-2:');
            data.models.filter(m => m.name.includes('gemini-2')).forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log('Error:', data);
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();
