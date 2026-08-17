USE [TECNOTEST]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_registrar_transferencia_almacen]

@emp_codigo char(3),
@suc_codigo char(3),
@alm_origen char(3),
@alm_destino char(3),
@fec_emi datetime,
@usuario varchar(15),
@detalles_json nvarchar(max),
@cco_codigo varchar(5),
@glosa varchar(200)

AS
BEGIN 
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY

        IF @alm_origen = @alm_destino
        BEGIN
            SELECT 0 AS success, 'El almacen origen y destino no pueden ser el mismo' AS message,
                   NULL AS mov_id_salida, NULL AS vale_salida, NULL AS mov_id_ingreso, NULL AS vale_ingreso
            RETURN
        END

        IF @detalles_json IS NULL OR @detalles_json = '' OR @detalles_json = '[]'
        BEGIN
            SELECT 0 AS success, 'Debe incluir al menos un articulo para transferir' AS message,
                   NULL AS mov_id_salida, NULL AS vale_salida, NULL AS mov_id_ingreso, NULL AS vale_ingreso
            RETURN
        END

        DECLARE @anho_actual varchar(4), @mes_actual varchar(2), @anho_2dig varchar(2)
        SET @anho_actual = LTRIM(RTRIM(CONVERT(varchar(4), YEAR(@fec_emi))))
        SET @mes_actual = RIGHT('0' + LTRIM(RTRIM(CONVERT(varchar(2), MONTH(@fec_emi)))), 2)
        SET @anho_2dig = RIGHT(@anho_actual, 2)

        DECLARE @art_sin_stock varchar(50)
        DECLARE @stock_actual decimal(18,3)
        DECLARE @cantidad_pedida decimal(18,3)

        SELECT TOP 1 
            @art_sin_stock = JSON_VALUE(item.value, '$.art_codigo'),
            @cantidad_pedida = CAST(JSON_VALUE(item.value, '$.cantidad') AS DECIMAL(18,3)),
            @stock_actual = ISNULL(stk.stock_real, 0)
        FROM OPENJSON(@detalles_json) AS item
        OUTER APPLY (
            SELECT 
                SUM(CASE WHEN b.mov_tipo = 'I' THEN a.mov_ctdmov ELSE 0 END) -
                SUM(CASE WHEN b.mov_tipo = 'S' THEN a.mov_ctdmov ELSE 0 END) AS stock_real
            FROM log_detmov a
            INNER JOIN log_cabmov b ON a.mov_id = b.mov_id
            WHERE b.mov_flag <> 'A' 
              AND b.alm_codigo = @alm_origen
              AND b.mov_fecemi <= @fec_emi
              AND a.art_codigo = JSON_VALUE(item.value, '$.art_codigo')
        ) stk
        WHERE CAST(JSON_VALUE(item.value, '$.cantidad') AS DECIMAL(18,3)) > ISNULL(stk.stock_real, 0)

        IF @art_sin_stock IS NOT NULL
        BEGIN
            SELECT 0 AS success, 
                   'Stock insuficiente para ' + @art_sin_stock + 
                   '. Disponible: ' + CAST(@stock_actual AS VARCHAR) + 
                   ', Solicitado: ' + CAST(@cantidad_pedida AS VARCHAR) AS message,
                   NULL AS mov_id_salida, NULL AS vale_salida, 
                   NULL AS mov_id_ingreso, NULL AS vale_ingreso
            RETURN
        END

        BEGIN TRANSACTION;

        DECLARE @num_salida int
        MERGE mae_correlativo WITH (HOLDLOCK) AS target
        USING (SELECT @emp_codigo AS emp, @alm_origen AS alm, 'MOV' AS tipo, @anho_actual AS anho) AS source
        ON target.emp_codigo = source.emp AND target.alm_codigo = source.alm 
           AND target.cor_tipo = source.tipo AND target.cor_anho = source.anho
        WHEN MATCHED THEN
            UPDATE SET cor_numero = RIGHT('0000000' + CAST(CAST(LTRIM(RTRIM(target.cor_numero)) AS INT) + 1 AS VARCHAR(7)), 7)
        WHEN NOT MATCHED THEN
            INSERT (emp_codigo, suc_codigo, alm_codigo, cor_tipo, cor_anho, cor_nmes, cor_serie, cor_numero, cor_desde, cor_hasta)
            VALUES (source.emp, '   ', source.alm, source.tipo, source.anho, '  ', '   ', '0000001', '       ', '       ');

        SELECT @num_salida = CAST(LTRIM(RTRIM(cor_numero)) AS INT)
        FROM mae_correlativo 
        WHERE emp_codigo = @emp_codigo AND alm_codigo = @alm_origen
          AND cor_tipo = 'MOV' AND cor_anho = @anho_actual

        DECLARE @mov_codigo_salida char(7)
        SET @mov_codigo_salida = RIGHT('0000000' + CAST(@num_salida AS VARCHAR(7)), 7)
        DECLARE @mov_id_salida char(10)
        SET @mov_id_salida = @anho_2dig + @alm_origen + RIGHT('00000' + CAST(@num_salida AS VARCHAR(5)), 5)

        DECLARE @num_ingreso int
        MERGE mae_correlativo WITH (HOLDLOCK) AS target
        USING (SELECT @emp_codigo AS emp, @alm_destino AS alm, 'MOV' AS tipo, @anho_actual AS anho) AS source
        ON target.emp_codigo = source.emp AND target.alm_codigo = source.alm 
           AND target.cor_tipo = source.tipo AND target.cor_anho = source.anho
        WHEN MATCHED THEN
            UPDATE SET cor_numero = RIGHT('0000000' + CAST(CAST(LTRIM(RTRIM(target.cor_numero)) AS INT) + 1 AS VARCHAR(7)), 7)
        WHEN NOT MATCHED THEN
            INSERT (emp_codigo, suc_codigo, alm_codigo, cor_tipo, cor_anho, cor_nmes, cor_serie, cor_numero, cor_desde, cor_hasta)
            VALUES (source.emp, '   ', source.alm, source.tipo, source.anho, '  ', '   ', '0000001', '       ', '       ');

        SELECT @num_ingreso = CAST(LTRIM(RTRIM(cor_numero)) AS INT)
        FROM mae_correlativo 
        WHERE emp_codigo = @emp_codigo AND alm_codigo = @alm_destino
          AND cor_tipo = 'MOV' AND cor_anho = @anho_actual

        DECLARE @mov_codigo_ingreso char(7)
        SET @mov_codigo_ingreso = RIGHT('0000000' + CAST(@num_ingreso AS VARCHAR(7)), 7)
        DECLARE @mov_id_ingreso char(10)
        SET @mov_id_ingreso = @anho_2dig + @alm_destino + RIGHT('00000' + CAST(@num_ingreso AS VARCHAR(5)), 5)

        -- =============================================
        -- CABECERA SALIDA (102)
        -- =============================================
        INSERT INTO log_cabmov (
            emp_codigo, mov_id, suc_codigo, alm_codigo, mov_codigo, cli_codigo, cls_codigo, cca_codigo, mov_tipo, mov_anho,
            mov_nmes, tmo_codigo, mov_fecemi, mov_fectras, mov_fecreg, ord_id, opr_id, mov_tpdoc, mov_serdoc, mov_nrodoc,
            mov_fserdoc, mov_fnrodoc, mov_indgre, codtrans, veh_placa, cho_codigo, mov_lugent, mov_glosa, mov_print, mov_flag,
            id_venta, cde_numdes, mov_inddev, mov_rectra, mov_indtra, mov_indcod, mov_idref, mre_codigo, mov_almdes, dsp_id,
            mov_indrnd, mov_indave, prv_codigo, mov_indsor, mov_indcom, mov_indapc, mov_dspspe, ncompra, user_, date,
            time, mov_indrdl, mov_indavc, edp_codigo, acc_id, numped, cco_codigo, rpr_codigo, req_id, mov_anufac,
            mov_movapr, mov_reqapr, mov_deplen, mov_pvnlen, mov_dislen, pca_numero, mov_proser, mov_prodoc, mov_proimp, prp_codigo,
            etp_codigo, user_imp, date_imp, time_imp, user_anu, date_anu, time_anu, ordcli, pesaje, transp,
            ructrans, licencia, placa, unidad, const_ins, cho_nombre, dni, envio_sunat, transporte, nro_bultos,
            peso_bruto, respuesta_nubefact, cvt_codigo, observa, destino, ruc_destino, factor_imp, mon_codigo
        )
        VALUES (
            @emp_codigo, @mov_id_salida, @suc_codigo, @alm_origen, @mov_codigo_salida, '000001', '', '', 'S', @anho_actual,
            @mes_actual, '102', @fec_emi, @fec_emi, '19000101', '', '', '-', '', '',
            '', '', 0, '', '', '', '', @glosa, 0, ' ',
            '', '', 0, 0, 1, 0, @mov_id_ingreso, '', @alm_destino, '',
            0, 0, '', 0, 0, 0, 0, '', @usuario, GETDATE(),
            CONVERT(VARCHAR(8), GETDATE(), 108), 0, 0, '', '', '', @cco_codigo, '', '', 0,
            0, 0, '', '', '', '', '', '', 0, '',
            '', '', '19000101', '', '', '19000101', '', '', '', '',
            '', '', '', '', '', '', '', '', '', 0,
            0.00, '', '', '', '', '', 0.00, ''
        )

        -- =============================================
        -- CABECERA INGRESO (023)
        -- =============================================
        INSERT INTO log_cabmov (
            emp_codigo, mov_id, suc_codigo, alm_codigo, mov_codigo, cli_codigo, cls_codigo, cca_codigo, mov_tipo, mov_anho,
            mov_nmes, tmo_codigo, mov_fecemi, mov_fectras, mov_fecreg, ord_id, opr_id, mov_tpdoc, mov_serdoc, mov_nrodoc,
            mov_fserdoc, mov_fnrodoc, mov_indgre, codtrans, veh_placa, cho_codigo, mov_lugent, mov_glosa, mov_print, mov_flag,
            id_venta, cde_numdes, mov_inddev, mov_rectra, mov_indtra, mov_indcod, mov_idref, mre_codigo, mov_almdes, dsp_id,
            mov_indrnd, mov_indave, prv_codigo, mov_indsor, mov_indcom, mov_indapc, mov_dspspe, ncompra, user_, date,
            time, mov_indrdl, mov_indavc, edp_codigo, acc_id, numped, cco_codigo, rpr_codigo, req_id, mov_anufac,
            mov_movapr, mov_reqapr, mov_deplen, mov_pvnlen, mov_dislen, pca_numero, mov_proser, mov_prodoc, mov_proimp, prp_codigo,
            etp_codigo, user_imp, date_imp, time_imp, user_anu, date_anu, time_anu, ordcli, pesaje, transp,
            ructrans, licencia, placa, unidad, const_ins, cho_nombre, dni, envio_sunat, transporte, nro_bultos,
            peso_bruto, respuesta_nubefact, cvt_codigo, observa, destino, ruc_destino, factor_imp, mon_codigo
        )
        VALUES (
            @emp_codigo, @mov_id_ingreso, @suc_codigo, @alm_destino, @mov_codigo_ingreso, '000001', '', '', 'I', @anho_actual,
            @mes_actual, '023', @fec_emi, '19000101', '19000101', '', '', '-', '', '',
            '', '', 0, '', '', '', '', @glosa, 0, ' ',
            '', '', 0, 1, 1, 0, @mov_id_salida, '', @alm_origen, '',
            0, 0, '', 0, 0, 0, 0, '', @usuario, GETDATE(),
            CONVERT(VARCHAR(8), GETDATE(), 108), 0, 0, '', '', '', @cco_codigo, '', '', 0,
            0, 0, '', '', '', '', '', '', 0, '',
            '', '', '19000101', '', '', '19000101', '', '', '', '',
            '', '', '', '', '', '', '', '', '', 0,
            0.00, '', '', '', '', '', 0.00, ''
        )

        -- =============================================
        -- DETALLE SALIDA
        -- =============================================
        INSERT INTO log_detmov (
            emp_codigo, mov_id, art_codigo, art_nombre, art_proceso, lot_codigo, art_codref,
            mov_item, mov_ctdcom, mov_ctdmov, mov_cuni, mov_ctotal,
            mov_vuni, mov_vpro, mov_vmov, mov_vcom, 
            mov_vunid, mov_vprod, mov_vmovd,
            mov_indcla, mov_indbon, mov_indnc, mov_idnota, mov_vaso, mov_artbon,
            no_ord_tra, mov_sec, kilos, mov_detalle, bobinas, metros, paquetes, millares, merma,
            f_fab, f_ven, cco_codigo
        )
        SELECT 
            @emp_codigo, @mov_id_salida,
            JSON_VALUE(item.value, '$.art_codigo'), JSON_VALUE(item.value, '$.art_nombre'), '', ISNULL(JSON_VALUE(item.value, '$.lot_codigo'), ''), '',
            RIGHT('00' + CAST(CAST(item.[key] AS INT) AS VARCHAR(2)), 2), 0.000, CAST(JSON_VALUE(item.value, '$.cantidad') AS DECIMAL(18, 3)), 0.000, 0.000,
            ISNULL(stk.costo_sol, 0.000), ISNULL(stk.costo_sol, 0.000), ISNULL(stk.costo_sol, 0.000), 0.000,
            ISNULL(stk.costo_dol, 0.000), ISNULL(stk.costo_dol, 0.000), ISNULL(stk.costo_dol, 0.000),
            0, 0, 0, '', 0, '',
            '', '', 0.000, '', 0.000, 0.00, 0, 0.000, 0.00,
            '19000101', '19000101', @cco_codigo
        FROM OPENJSON(@detalles_json) AS item
        OUTER APPLY (
            SELECT TOP 1 stk_vfin AS costo_sol, stk_vfind AS costo_dol
            FROM log_stkarticulo 
            WHERE emp_codigo = @emp_codigo AND alm_codigo = @alm_origen AND art_codigo = JSON_VALUE(item.value, '$.art_codigo')
              AND stk_anho = @anho_actual AND stk_nmes = @mes_actual
            ORDER BY CASE WHEN lot_codigo = ISNULL(JSON_VALUE(item.value, '$.lot_codigo'), '') THEN 0 ELSE 1 END
        ) stk

        -- =============================================
        -- DETALLE INGRESO
        -- =============================================
        INSERT INTO log_detmov (
            emp_codigo, mov_id, art_codigo, art_nombre, art_proceso, lot_codigo, art_codref,
            mov_item, mov_ctdcom, mov_ctdmov, mov_cuni, mov_ctotal,
            mov_vuni, mov_vpro, mov_vmov, mov_vcom, 
            mov_vunid, mov_vprod, mov_vmovd,
            mov_indcla, mov_indbon, mov_indnc, mov_idnota, mov_vaso, mov_artbon,
            no_ord_tra, mov_sec, kilos, mov_detalle, bobinas, metros, paquetes, millares, merma,
            f_fab, f_ven, cco_codigo
        )
        SELECT 
            @emp_codigo, @mov_id_ingreso,
            JSON_VALUE(item.value, '$.art_codigo'), JSON_VALUE(item.value, '$.art_nombre'), '', ISNULL(JSON_VALUE(item.value, '$.lot_codigo'), ''), '',
            RIGHT('00' + CAST(CAST(item.[key] AS INT) AS VARCHAR(2)), 2), 0.000, CAST(JSON_VALUE(item.value, '$.cantidad') AS DECIMAL(18, 3)), 0.000, 0.000,
            ISNULL(stk.costo_sol, 0.000), ISNULL(stk.costo_sol, 0.000), ISNULL(stk.costo_sol, 0.000), 0.000,
            ISNULL(stk.costo_dol, 0.000), ISNULL(stk.costo_dol, 0.000), ISNULL(stk.costo_dol, 0.000),
            0, 0, 0, '', 0, '',
            '', '', 0.000, '', 0.000, 0.00, 0, 0.000, 0.00,
            '19000101', '19000101', @cco_codigo
        FROM OPENJSON(@detalles_json) AS item
        OUTER APPLY (
            SELECT TOP 1 stk_vfin AS costo_sol, stk_vfind AS costo_dol
            FROM log_stkarticulo 
            WHERE emp_codigo = @emp_codigo AND alm_codigo = @alm_origen AND art_codigo = JSON_VALUE(item.value, '$.art_codigo')
              AND stk_anho = @anho_actual AND stk_nmes = @mes_actual
            ORDER BY CASE WHEN lot_codigo = ISNULL(JSON_VALUE(item.value, '$.lot_codigo'), '') THEN 0 ELSE 1 END
        ) stk

        COMMIT TRANSACTION;

        SELECT 1 AS success, 'Transferencia registrada correctamente' AS message,
               @mov_id_salida AS mov_id_salida, @mov_codigo_salida AS vale_salida,
               @mov_id_ingreso AS mov_id_ingreso, @mov_codigo_ingreso AS vale_ingreso

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS success, ERROR_MESSAGE() AS message, NULL AS mov_id_salida, NULL AS vale_salida, NULL AS mov_id_ingreso, NULL AS vale_ingreso
    END CATCH
END
GO
