// LockShopDown — inicializador para Windows.
// Abre o jogo (pasta "game") numa janela própria, sem barra de navegador,
// usando o Microsoft Edge que já vem no Windows 10/11 (ou o Chrome, se houver).
// Funciona sem internet. O progresso fica salvo em %LOCALAPPDATA%\LockShopDown.
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("LockShopDown")]
[assembly: AssemblyProduct("LockShopDown")]
[assembly: AssemblyDescription("Liquidação Final. Tudo deve sair. Inclusive você.")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

static class Program
{
    [STAThread]
    static void Main()
    {
        string dir = AppDomain.CurrentDomain.BaseDirectory;
        string page = Path.Combine(Path.Combine(dir, "game"), "index.html");
        if (!File.Exists(page))
        {
            MessageBox.Show("Não encontrei a pasta \"game\".\n\nDeixe o LockShopDown.exe sempre junto da pasta \"game\" (extraia o ZIP inteiro antes de jogar).",
                "LockShopDown", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        string url = new Uri(page).AbsoluteUri;
        string profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "LockShopDown");
        string pf86 = Environment.GetEnvironmentVariable("ProgramFiles(x86)") ?? "";
        string pf = Environment.GetEnvironmentVariable("ProgramFiles") ?? "";
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

        string[] browsers = {
            Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(local, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(local, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
        };

        string args = "--app=\"" + url + "\"" +
                      " --user-data-dir=\"" + profile + "\"" +
                      " --no-first-run --no-default-browser-check" +
                      " --autoplay-policy=no-user-gesture-required" +
                      " --disable-features=Translate,msEdgeSidebarV2" +
                      " --start-maximized";

        foreach (string exe in browsers)
        {
            if (exe.Length == 0 || !File.Exists(exe)) continue;
            try
            {
                Process.Start(new ProcessStartInfo(exe, args) { UseShellExecute = false });
                return;
            }
            catch { /* tenta o próximo */ }
        }

        // Sem Edge nem Chrome: abre no navegador padrão (funciona igual, só com a barra do navegador).
        try { Process.Start(page); }
        catch
        {
            MessageBox.Show("Não consegui abrir o jogo.\n\nAbra manualmente o arquivo game\\index.html num navegador (Edge, Chrome ou Firefox).",
                "LockShopDown", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}
