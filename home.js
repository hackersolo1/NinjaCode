document.addEventListener("DOMContentLoaded", () => {

    document.querySelector('#loginBtnHome').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.querySelector('#loginBtnHero').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.querySelector('#loginBtnCTA').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    const supabaseClient = supabase.createClient('https://ykcuvifswqpbdlfxacuq.supabase.co', 'sb_publishable_3wmlV5-OK_EZnXwgRvbKPg_7hftDG08');

    // Botão de login com Google
    async function signInWithGoogle() {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'http://localhost:3000/index.html'
            }
        })
        if (error) {
            console.error(error)
        } else {
            const user = data.user;
            const userInfo = {
                id: user.id,
                email: user.email,
                name: user.user_metadata.full_name,
                avatar_url: user.user_metadata.avatar_url
            }

            console.log(userInfo);

            localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
    }

});